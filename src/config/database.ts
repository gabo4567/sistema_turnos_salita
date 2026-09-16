import mongoose from 'mongoose';
import dns from 'dns';

// Workaround: en esta máquina, el resolver DNS de Node no puede consultar
// registros SRV contra el DNS del router. Forzamos DNS públicos para poder
// resolver el connection string mongodb+srv://.
dns.setServers(['8.8.8.8', '1.1.1.1']);

export const connectDB = async (): Promise<void> => {
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
