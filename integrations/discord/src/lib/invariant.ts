export function i(condition: boolean, message: string) {
  if (condition) return;

  throw new Error(message);
}

export async function except(cb: () => void): Promise<string | null> {
  try {
    await cb();
    return null;
  } catch (e) {
    return e.message;
  }
}

export default i;
