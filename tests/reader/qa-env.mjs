export function isolatedDatabaseURL() {
  const value = process.env.READER_QA_DATABASE_URL;
  const name = process.env.READER_QA_DATABASE_NAME;
  if (!value || !name || !/^reader_qa_[a-f0-9]+$/.test(name)) throw new Error("Isolated QA database required");
  const url = new URL(value);
  if (url.protocol !== "postgresql:" || url.hostname !== "127.0.0.1" || url.pathname !== `/${name}` || !url.port || process.env.DATABASE_URL !== value || process.env.DIRECT_URL !== value) {
    throw new Error("Refusing non-isolated database");
  }
  return value;
}
