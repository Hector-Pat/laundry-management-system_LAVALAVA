require('dotenv').config();

const MOCK_LOG_PREFIX = '[MOCK WHATSAPP]';

function isConfigured() {
    return Boolean(
        process.env.TWILIO_ACCOUNT_SID &&
            process.env.TWILIO_AUTH_TOKEN &&
            process.env.TWILIO_WHATSAPP_FROM
    );
}

function buildMessage(pedido) {
    return `Hola ${pedido.cliente.fullName}, tu pedido ${pedido.folio} de LavaLava ya esta listo para recoger.`;
}

function buildWhatsAppNumber(phoneNumber) {
    const countryCode = process.env.TWILIO_WHATSAPP_COUNTRY_CODE || '+52';
    return `whatsapp:${countryCode}${phoneNumber}`;
}

// Avisa por WhatsApp (Twilio) que un pedido paso a estado LISTO (RF-04).
// Sin credenciales de Twilio en .env no hay forma de mandar un mensaje real:
// se deja constancia en consola marcada como MOCK en vez de simular un envio
// que nunca ocurrio.
async function notifyPedidoListo(pedido) {
    const to = buildWhatsAppNumber(pedido.cliente.phoneNumber);
    const body = buildMessage(pedido);

    if (!isConfigured()) {
        console.info(
            `${MOCK_LOG_PREFIX} to=${to} body="${body}" (faltan TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_WHATSAPP_FROM en .env, no se envio nada real)`
        );
        return { sent: false, mock: true };
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_FROM;

    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const params = new URLSearchParams({ To: to, From: from, Body: body });

    const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
            method: 'POST',
            headers: {
                Authorization: `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        }
    );

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Twilio WhatsApp request failed (${response.status}): ${errorBody}`);
    }

    return { sent: true, mock: false };
}

module.exports = {
    notifyPedidoListo
};
