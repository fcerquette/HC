export enum Sexo {
  Masculino = 'M',
  Femenino = 'F',
  Otro = 'X',
}

export enum AccionAuditoria {
  Crear = 'CREATE',
  Leer = 'READ',
  Actualizar = 'UPDATE',
  Eliminar = 'DELETE',
}

/** Tipos de campo soportados por el schema JSON de las plantillas de ficha. */
export enum TipoCampoFicha {
  Texto = 'text',
  TextoLargo = 'textarea',
  Numero = 'number',
  Fecha = 'date',
  Booleano = 'boolean',
  Seleccion = 'select',
}
