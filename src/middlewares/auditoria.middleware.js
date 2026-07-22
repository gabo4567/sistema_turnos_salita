
const auditoriaMunicipal = (req, res, next) => {
    const horaActual = new Date().toLocaleTimeString();
    const metodo = req.method;
    const ruta = req.originalUrl;

    console.log(`[${horaActual}] ${metodo} ${ruta}`);

    next();

};

module.exports = auditoriaMunicipal;
