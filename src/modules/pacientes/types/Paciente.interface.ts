import { Document, Types } from 'mongoose';
import { ObraSocial } from './PacienteObraSocial.enum';
import { TipoTelefono } from './PacienteTelefono.enum';

export interface IDireccion {
    calle: string;
    numero: string;
    piso?: string;
    departamento?: string;
    barrio?: string;
}

export interface ITelefono {
    tipo?: TipoTelefono;
    codigoArea: string;
    numero: string;
}

export interface IObraSocial {
    nombre: ObraSocial;
    numeroAfiliado?: string;
}

export interface IHistorialMedico {
    fecha: Date;
    diagnostico: string;
    tratamiento: string;
    medico: string;
}

export interface IPaciente extends Document {
    id?: Types.ObjectId;
    nombre: string;
    dni: string;
    direccion: IDireccion;
    email: string;
    telefono: ITelefono;
    obraSocial: IObraSocial;
    historialMedico: IHistorialMedico[];
    activo: boolean;
}
