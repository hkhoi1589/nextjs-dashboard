// By adding the 'use server', you mark all the exported functions within the file as server functions.
// These server functions can then be imported into Client and Server components, making them extremely versatile.
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
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
	// Type validation and coercion
	const { customerId, amount, status } = CreateInvoice.parse({
		customerId: formData.get('customerId'),
		amount: formData.get('amount'),
		status: formData.get('status'),
	});

	// Let's convert the amount into cents
	const amountInCents = amount * 100;
	const date = new Date().toISOString().split('T')[0];

	// insert the new invoice into your database or call api
	await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;

	// Since you're updating the data displayed in the invoices route, you need revalidated this route to see it work
	revalidatePath('/dashboard/invoices');

	// redirect the user to the invoice's page
	redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, formData: FormData) {
	// Extracting the data from formData.
	// And validating the types with Zod
	const { customerId, amount, status } = UpdateInvoice.parse({
		customerId: formData.get('customerId'),
		amount: formData.get('amount'),
		status: formData.get('status'),
	});

	// Converting the amount to cents
	const amountInCents = amount * 100;

	// update the invoice into your database or call api
	await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
    `;

	// clear the client cache and make a new server request
	revalidatePath('/dashboard/invoices');

	// redirect the user to the invoice's page
	redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
	await sql`DELETE FROM invoices WHERE id = ${id}`;
	revalidatePath('/dashboard/invoices');
}
