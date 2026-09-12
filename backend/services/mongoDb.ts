import mongoose from "mongoose";

// Establishes a connection to MongoDB using Mongoose
export const mongoDB = async () => {
  try {
    let uri: string =
      process.env.MONGO_URI ?? "mongodb://localhost:27017/mock-db";

    await mongoose.connect(uri);
  } catch (error: unknown) {
    console.error("Error real de Mongoose:", error);
    throw new Error("Error conectandose a la base de datos");
  }
};

/**
 * Drop database, close the connection, and stop the server
 */
export const closeDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoose.disconnect();
};

/**
 * Remove all data from all collections (useful between tests)
 */
export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};
