import mongoose from 'mongoose';
import dns from 'dns';

export const connectDB = async (): Promise<void> => {
    // Workaround: en la máquina local de desarrollo, el resolver DNS de Node
    // no puede consultar registros SRV contra el DNS del router. Forzamos DNS
    // públicos para poder resolver el connection string mongodb+srv://.
    // Solo aplica en local: en Render (y otros hosts) esto puede bloquear la
    // resolución en vez de arreglarla, porque la red del contenedor no
    // siempre permite consultas DNS salientes a resolvers arbitrarios.
    // Va dentro de la función (no a nivel de módulo) porque los imports de
    // ESM se ejecutan antes que dotenv.config() en app.ts, así que a nivel
    // de módulo process.env.ENTORNO todavía no existe.
    if (process.env.ENTORNO === 'Local') {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
    }

    try {
        await mongoose.connect(process.env.DATABASE_URL as string);
    } catch (error) {
        console.error('🔴 Error al conectar a la base de datos:', error);
        process.exit(1);
    }
};

mongoose.connection.on('connected', () => {
    console.log('🟢 Conexión a la base de datos establecida');
});

mongoose.connection.on('disconnected', () => {
    console.log('🟡 Conexión a la base de datos perdida');
});

process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('🔴 Conexión a la base de datos cerrada por terminación de la aplicación');
    process.exit(0);
});
