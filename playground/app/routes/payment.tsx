import { conform, useFieldset, useForm } from '@conform-to/react';
import { getFieldsetConstraint, parse } from '@conform-to/zod';
import { type ActionArgs, type LoaderArgs, json } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { z } from 'zod';
import { Playground, Field } from '~/components';
import { parseConfig } from '~/config';

const schema = z.object({
	iban: z
		.string({ required_error: 'IBAN is required' })
		.regex(
			/^[A-Z]{2}[0-9]{2}(?:[ ]?[0-9]{4}){4}(?:[ ]?[0-9]{1,2})?$/,
			'Please provide a valid IBAN',
		),
	amount: z.object({
		currency: z
			.string({ required_error: 'Please select a currency' })
			.min(3, 'Please select a currency'),
		value: z.number({ required_error: 'Value is required' }).min(1),
	}),
	timestamp: z.date({ required_error: 'Timestamp is required' }),
	verified: z.boolean({ required_error: 'Please verify' }),
});

export async function loader({ request }: LoaderArgs) {
	return parseConfig(request);
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parse(formData, { schema });

	return json(submission);
}

export default function PaymentForm() {
	const config = useLoaderData();
	const lastSubmission = useActionData();
	const [form, { iban, amount, timestamp, verified }] = useForm({
		...config,
		lastSubmission,
		constraint: getFieldsetConstraint(schema),
		onValidate: config.validate
			? ({ formData }) => parse(formData, { schema })
			: undefined,
		shouldRevalidate: 'onInput',
	});
	const { currency, value } = useFieldset(form.ref, {
		...amount,
		constraint: getFieldsetConstraint(schema.shape.amount),
	});

	return (
		<Form method="post" {...form.props}>
			<Playground title="Payment Form" lastSubmission={lastSubmission}>
				<fieldset>
					<Field label="IBAN" config={iban}>
						<input {...conform.input(iban, { type: 'text' })} />
					</Field>
					<Field label="Currency" config={currency}>
						<select {...conform.select(currency)}>
							<option value="">Please specify</option>
							<option value="USD">USD</option>
							<option value="EUR">EUR</option>
							<option value="GBP">GBP</option>
						</select>
					</Field>
					<Field label="Value" config={value}>
						<input {...conform.input(value, { type: 'number' })} />
					</Field>
					<Field label="Timestamp" config={timestamp}>
						<input {...conform.input(timestamp, { type: 'text' })} />
					</Field>
					<Field label="Verified" config={verified} inline>
						<input
							{...conform.input(verified, {
								type: 'checkbox',
							})}
						/>
					</Field>
				</fieldset>
			</Playground>
		</Form>
	);
}
