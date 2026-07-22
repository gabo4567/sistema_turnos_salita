const rutaNoEncontrada = (req, res, next) => {
    res.status(404).json({
        success: false,
        timestamp: new Date().toISOString(),
        error: "Ruta No Encontrada (404)",
        message: `La ruta ${req.originalUrl} no existe en el servidor`,
    });
};

module.exports = rutaNoEncontrada;
