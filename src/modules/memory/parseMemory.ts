import type { ChatMemory } from './chatMemory';
import type { ChatTurn } from './chatTurn';
import type { StoredFile } from './storedFile';

function toTurns(item: unknown): ChatTurn[] {
  if (typeof item !== 'object' || item === null) return [];
  const role = Reflect.get(item, 'role');
  const content = Reflect.get(item, 'content');
  return (role === 'user' || role === 'assistant') && typeof content === 'string' ? [{ role, content }] : [];
}

function toFile(value: unknown): StoredFile | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const id = Reflect.get(value, 'id');
  const name = Reflect.get(value, 'name');
  return typeof id === 'string' && typeof name === 'string' ? { id, name } : undefined;
}

function toMemory(value: unknown): ChatMemory {
  if (typeof value !== 'object' || value === null) return { turns: [] };
  const turns = Reflect.get(value, 'turns');
  const report = Reflect.get(value, 'lastReport');
  return {
    turns: Array.isArray(turns) ? turns.flatMap(toTurns) : [],
    lastReport: typeof report === 'string' ? report : undefined,
    file: toFile(Reflect.get(value, 'file')),
  };
}

/** Reads the saved memory file. It keeps only the parts that have the right shape, so a broken file cannot crash the bot. */
export function parseMemory(input: unknown): Map<number, ChatMemory> {
  if (typeof input !== 'object' || input === null) return new Map();
  const entries = Object.entries(input).flatMap(([key, value]): [number, ChatMemory][] =>
    Number.isInteger(Number(key)) ? [[Number(key), toMemory(value)]] : [],
  );
  return new Map(entries);
}
