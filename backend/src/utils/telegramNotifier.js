require('dotenv').config();

const MOCK_LOG_PREFIX = '[MOCK TELEGRAM]';

function isConfigured() {
    return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}

function buildMessage(pedido) {
    return `Hola ${pedido.cliente.fullName}, tu pedido ${pedido.folio} de LavaLava ya esta listo para recoger.`;
}

// Avisa por Telegram que un pedido paso a estado LISTO (RF-04). El chat_id
// se llena cuando el cliente vincula su numero con el bot (ver telegramBot.js);
// sin token de bot o sin chat vinculado no hay forma de mandar un mensaje
// real, asi que se deja constancia en consola en vez de simular un envio
// que nunca ocurrio.
async function notifyPedidoListo(pedido) {
    const body = buildMessage(pedido);

    if (!isConfigured()) {
        console.info(
            `${MOCK_LOG_PREFIX} folio=${pedido.folio} body="${body}" (falta TELEGRAM_BOT_TOKEN en .env, no se envio nada real)`
        );
        return { sent: false, mock: true };
    }

    if (!pedido.cliente.telegramChatId) {
        console.warn(
            `[telegram] cliente de ${pedido.folio} aun no vinculo su Telegram, no se pudo notificar`
        );
        return { sent: false, mock: false };
    }

    const response = await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: pedido.cliente.telegramChatId, text: body })
        }
    );

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Telegram sendMessage request failed (${response.status}): ${errorBody}`);
    }

    return { sent: true, mock: false };
}

module.exports = {
    notifyPedidoListo
};
