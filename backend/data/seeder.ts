import mongoose from "mongoose";
import { UserModel } from "../model/user.model";
import { TransactionsModel } from "../model/transactions.model";
import { DocumentModel } from "../model/documents.model";

const MONGO_URI = process.env.MONGO_URI;

async function seedDB() {
  if (!MONGO_URI) throw Error("No se pudo conectar a la base de datos");
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully.");

    await UserModel.deleteMany({});
    await TransactionsModel.deleteMany({});
    console.log("Cleaned previous database records.");

    const createdUsers = await createUsers();
    console.log(`Created ${createdUsers.length} users.`);

    const createdTransactions = await createTransactions(createdUsers);
    console.log(`Created ${createdTransactions.length} transactions.`);

    const createdDocuments = await createDocuments(createdUsers);
    console.log(`Creados ${createdDocuments.length} documentos.`);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding the database:", error);
  } finally {
    // 4. Cerrar la conexión
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

async function createUsers() {
  const users = [
    { name: "Alice Smith", age: 20, job: "Uni Student" },
    { name: "Bob Johnson", age: 35, job: "Product Manager" },
    { name: "Charlie Brown", age: 22, job: "Junior UI/UX Designer" },
    { name: "Diana Prince", age: 80, job: "Retired" },
  ];

  return await UserModel.insertMany(users);
}

async function createTransactions(users: any[]) {
  // Opciones específicas para INGRESOS (positivos)
  const incomeTemplates = [
    { category: "Salary", reason: "Monthly paycheck", min: 2500, max: 4500 },
    {
      category: "Freelance",
      reason: "Web development project",
      min: 300,
      max: 1200,
    },
    { category: "Investments", reason: "Stock dividends", min: 50, max: 300 },
    {
      category: "Refund",
      reason: "Tax refund / Store credit",
      min: 20,
      max: 150,
    },
  ];

  // Opciones específicas para EGRESOS (negativos)
  const expenseTemplates = [
    { category: "Food", reason: "Supermarket groceries", min: 40, max: 200 },
    {
      category: "Transport",
      reason: "Uber ride / Gas refill",
      min: 15,
      max: 60,
    },
    {
      category: "Entertainment",
      reason: "Netflix / Movie theater",
      min: 10,
      max: 50,
    },
    {
      category: "Utilities",
      reason: "Electricity & Internet bill",
      min: 80,
      max: 180,
    },
    {
      category: "Health",
      reason: "Pharmacy / Gym membership",
      min: 30,
      max: 100,
    },
    { category: "Shopping", reason: "Clothes purchase", min: 25, max: 150 },
  ];

  const transactionsToInsert = [];

  const getRandomDate = () => {
    const now = new Date();
    const pastDays = Math.floor(Math.random() * 90); // Últimos 90 días
    return new Date(now.setDate(now.getDate() - pastDays));
  };

  for (const user of users) {
    // 1. Garantizar al menos 1 o 2 INGRESOS por usuario
    const incomeCount = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < incomeCount; i++) {
      const template =
        incomeTemplates[Math.floor(Math.random() * incomeTemplates.length)];
      const positiveAmount = parseFloat(
        (
          Math.random() * (template.max - template.min + 1) +
          template.min
        ).toFixed(2),
      );

      transactionsToInsert.push({
        id_user: user._id,
        amount: positiveAmount,
        category: template.category,
        reason: template.reason,
        createdAt: getRandomDate(),
      });
    }

    const expenseCount = Math.floor(Math.random() * 5) + 6;
    for (let i = 0; i < expenseCount; i++) {
      const template =
        expenseTemplates[Math.floor(Math.random() * expenseTemplates.length)];
      const positiveAmount = parseFloat(
        (
          Math.random() * (template.max - template.min + 1) +
          template.min
        ).toFixed(2),
      );

      transactionsToInsert.push({
        id_user: user._id,
        amount: -positiveAmount,
        category: template.category,
        reason: template.reason,
        createdAt: getRandomDate(),
      });
    }
  }

  return await TransactionsModel.insertMany(transactionsToInsert);
}

async function createDocuments(users: any[]) {
  const documentTemplates = [
    {
      title: "Contrato de Prestación de Servicios",
      category: "Legal",
      content:
        "Este contrato establece los términos y condiciones de trabajo entre el cliente y el prestador de servicios. Ambas partes se comprometen a cumplir con los entregables dentro de los plazos fijados.",
    },
    {
      title: "Reporte Financiero Mensual",
      category: "Finanzas",
      content:
        "Resumen del balance general, desglose de ingresos y gastos operativos del periodo. Se destaca un incremento constante en los ahorros en comparación con el mes anterior.",
    },
    {
      title: "Notas de Reunión de Proyecto",
      category: "Minutas",
      content:
        "Puntos clave abordados durante la sesión: revisión del avance de la base de datos, ajuste de vistas en el frontend y asignación de tareas de testing para la próxima semana.",
    },
    {
      title: "Comprobante de Gastos Médicos",
      category: "Facturas",
      content:
        "Comprobante emitido por consulta médica general y compra de medicamentos prescritos para dedución de impuestos anuales.",
    },
  ];

  const documentsToInsert = [];

  const getRandomDate = () => {
    const now = new Date();
    const pastDays = Math.floor(Math.random() * 60);
    return new Date(now.setDate(now.getDate() - pastDays));
  };

  for (const user of users) {
    // Crear de 2 a 4 documentos por usuario
    const docCount = Math.floor(Math.random() * 3) + 2;

    for (let i = 0; i < docCount; i++) {
      const template =
        documentTemplates[Math.floor(Math.random() * documentTemplates.length)];

      documentsToInsert.push({
        id_user: user._id,
        title: template.title,
        category: template.category,
        content: template.content,
        createdAt: getRandomDate(),
      });
    }
  }

  return await DocumentModel.insertMany(documentsToInsert);
}

seedDB();
