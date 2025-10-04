import Dexie, { Table } from "dexie";

// Definimos el modelo de Producto
export interface Producto {
  id?: number;
  nombre: string;
  precio_compra: number;
  precio_venta: number;
  stock: number;
  unidad_medida: string; // "unidad", "libra", "kilo"
  creado_en?: string;
}

// Definimos el modelo de Venta
export interface Venta {
  id?: number;
  fecha: string;
  total: number;
}

// Detalle de cada venta
export interface DetalleVenta {
  id?: number;
  venta_id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

// Clase de la base de datos Dexie
export class FacturacionDB extends Dexie {
  productos!: Table<Producto, number>;
  ventas!: Table<Venta, number>;
  detalle_ventas!: Table<DetalleVenta, number>;

  constructor() {
    super("facturacionDB");

    this.version(1).stores({
      productos: "++id,nombre,precio_compra,precio_venta,stock,unidad_medida,creado_en",
      ventas: "++id,fecha,total",
      detalle_ventas: "++id,venta_id,producto_id,cantidad,precio_unitario,subtotal"
    });
  }
}

// Instancia global de la DB
export const db = new FacturacionDB();