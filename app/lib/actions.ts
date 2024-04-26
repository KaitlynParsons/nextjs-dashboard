// mark all the exported functions as server functions
'use server';

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

/**
 * Creates a new invoice
 * @param formData the data for the invoice
 */
export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse(
    Object.fromEntries(formData.entries()),
  );
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  try {
    // insert into invoices table
    await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }
  // revalidate to get fresh data and redirect to invoices page
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

/**
 * Updates an invoice
 * @param id the invoice identifier
 * @param formData the data to update the invoice
 */
export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse(
    Object.fromEntries(formData.entries()),
  );
  const amountInCents = amount * 100;

  try {
    // update the invoice in the invoice table
    await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
      `;
  } catch (error) {
    return { message: 'Database Error: Failed to Update Invoice.' };
  }

  // revalidate to get fresh data and redirect to invoices page
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

/**
 * Deletes an invoice by id and redirect to invoices page
 * @param id the id of the invoice
 */
export async function deleteInvoice(id: string) {
  throw new Error('Failed to Delete Invoice');
  
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
    return {message: 'Deleted Invoice.'};
  } catch (error) {
    return { message: 'Database Error: Failed to Delete Invoice.' };
  }
}
