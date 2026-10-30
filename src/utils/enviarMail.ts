// Envío de mail transaccional vía la API HTTP de Brevo (https://api.brevo.com).
// Se usa fetch directo en vez del SDK de Brevo para no sumar una dependencia
// nueva solo para este único caso de uso.
const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

export const enviarMailRecuperacion = async (email: string, nombre: string, link: string): Promise<void> => {
    const apiKey = process.env.BREVO_API_KEY;
    const remitente = process.env.EMAIL_REMITENTE;

    if (!apiKey || !remitente) {
        throw new Error('Falta configurar BREVO_API_KEY o EMAIL_REMITENTE');
    }

    const respuesta = await fetch(BREVO_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'api-key': apiKey,
        },
        body: JSON.stringify({
            sender: { email: remitente, name: 'Salita Municipal N.º 12' },
            to: [{ email, name: nombre }],
            subject: 'Restablecer tu contraseña — Salita Municipal N.º 12',
            htmlContent: `
                <p>Hola ${nombre},</p>
                <p>Recibimos un pedido para restablecer tu contraseña del sistema de turnos de la Salita Municipal N.º 12.</p>
                <p><a href="${link}">Hacé clic acá para elegir una contraseña nueva</a></p>
                <p>Este enlace vence en 30 minutos. Si vos no pediste esto, podés ignorar este mail.</p>
            `,
        }),
    });

    if (!respuesta.ok) {
        const detalle = await respuesta.text().catch(() => '');
        throw new Error(`Brevo respondió ${respuesta.status}: ${detalle}`);
    }
};
