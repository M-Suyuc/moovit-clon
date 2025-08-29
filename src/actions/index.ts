"use server";
import { revalidatePath } from "next/cache";
import type { Todo } from "./types";
import db from "./db";

export async function getTodos(): Promise<Todo[]> {
  try {
    const result = await db.query<Todo>("SELECT * FROM todo ORDER BY id DESC");
    return result.rows;
  } catch (error) {
    console.error("Error fetching todos:", error);
    return [];
  }
}

export async function addTodo(text: string): Promise<Todo | null> {
  try {
    const result = await db.query<Todo>(
      "INSERT INTO todo (text) VALUES ($1) RETURNING *",
      [text]
    );
    revalidatePath("/");
    return result.rows[0];
  } catch (error) {
    console.error("Error adding todo:", error);
    return null;
  }
}

export async function deleteTodo(id: number): Promise<boolean> {
  try {
    await db.query("DELETE FROM todo WHERE id = $1", [id]);
    revalidatePath("/");
    return true;
  } catch (error) {
    console.error("Error deleting todo:", error);
    return false;
  }
}

export async function toggleTodo(id: number): Promise<Todo | null> {
  try {
    const result = await db.query<Todo>(
      "UPDATE todo SET is_done = NOT is_done WHERE id = $1 RETURNING *",
      [id]
    );
    revalidatePath("/");
    return result.rows[0];
  } catch (error) {
    console.error("Error toggling todo:", error);
    return null;
  }
}
