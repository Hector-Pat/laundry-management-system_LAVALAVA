require('dotenv').config();

const clientesRepository = require('../modules/clientes/clientes.repository');

// Long polling en vez de webhook: no necesita una URL publica/HTTPS, asi que
// funciona igual en desarrollo local, en Docker o en un demo escolar sin
// tener que exponer el servidor a internet.
const POLL_TIMEOUT_SECONDS = 30;
const RETRY_DELAY_MS = 1000;

let stopped = true;

function isConfigured() {
    return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}

function apiUrl(method) {
    return `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`;
}

async function sendMessage(chatId, text, extra = {}) {
    await fetch(apiUrl('sendMessage'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, ...extra })
    });
}

// El contact.phone_number que manda Telegram trae codigo de pais (p.ej.
// "+525512345678"); clientes.phone_number son 10 digitos sin codigo de
// pais (ver clientes.service.js::validatePhone), asi que solo nos quedamos
// con los ultimos 10 digitos.
function normalizePhoneNumber(rawPhone) {
    return String(rawPhone).replace(/\D/g, '').slice(-10);
}

async function handleContact(chatId, contact) {
    const phoneNumber = normalizePhoneNumber(contact.phone_number);
    const matches = await clientesRepository.findByPhoneNumber(phoneNumber);

    if (matches.length === 0) {
        await sendMessage(
            chatId,
            `No encontramos ningun cliente registrado con el numero ${phoneNumber}. ` +
                'Verifica que sea el mismo que diste en mostrador al levantar tu pedido.',
            { reply_markup: { remove_keyboard: true } }
        );
        return;
    }

    await clientesRepository.linkTelegramChatId(phoneNumber, String(chatId));

    await sendMessage(
        chatId,
        `Listo, ${matches[0].fullName}. A partir de ahora te avisaremos por aqui cuando tu pedido este listo.`,
        { reply_markup: { remove_keyboard: true } }
    );
}

async function handleStart(chatId) {
    await sendMessage(
        chatId,
        'Hola! Soy el bot de Lava-Lava. Comparte tu numero de telefono (el mismo que diste ' +
            'en mostrador) para avisarte por aqui cuando tu pedido este listo.',
        {
            reply_markup: {
                keyboard: [[{ text: 'Compartir mi numero', request_contact: true }]],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        }
    );
}

async function handleUpdate(update) {
    const message = update.message;

    if (!message) {
        return;
    }

    const chatId = message.chat.id;

    if (message.contact && message.contact.phone_number) {
        await handleContact(chatId, message.contact);
        return;
    }

    if (message.text === '/start') {
        await handleStart(chatId);
        return;
    }

    await sendMessage(chatId, 'Escribe /start para vincular tu numero y recibir avisos de tus pedidos.');
}

async function poll(offset) {
    if (stopped) {
        return;
    }

    let nextOffset = offset;

    try {
        const response = await fetch(
            `${apiUrl('getUpdates')}?timeout=${POLL_TIMEOUT_SECONDS}&offset=${offset}`,
            { signal: AbortSignal.timeout((POLL_TIMEOUT_SECONDS + 5) * 1000) }
        );
        const data = await response.json();

        if (data.ok) {
            for (const update of data.result) {
                nextOffset = update.update_id + 1;

                try {
                    await handleUpdate(update);
                } catch (error) {
                    console.warn(`[telegram] error procesando update ${update.update_id}: ${error.message}`);
                }
            }
        }
    } catch (error) {
        console.warn(`[telegram] error consultando getUpdates: ${error.message}`);
    }

    if (!stopped) {
        setTimeout(() => poll(nextOffset), RETRY_DELAY_MS);
    }
}

// Se llama una vez al arrancar el servidor (ver server.js). Sin
// TELEGRAM_BOT_TOKEN el bot simplemente no arranca: las notificaciones caen
// en modo mock (ver telegramNotifier.js) en vez de tronar el servidor.
function startTelegramBot() {
    if (!isConfigured()) {
        console.info('[telegram] TELEGRAM_BOT_TOKEN no configurado, el bot de notificaciones no se inicio.');
        return;
    }

    stopped = false;
    console.info('[telegram] bot de notificaciones iniciado (long polling)');
    poll(0);
}

function stopTelegramBot() {
    stopped = true;
}

module.exports = {
    startTelegramBot,
    stopTelegramBot
};
