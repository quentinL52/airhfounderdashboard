const fs = require('fs');
const file = 'src/components/finances/finance-entry-form.tsx';
let content = fs.readFileSync(file, 'utf8');

const startStr = '    const onSubmit = (values: z.infer<typeof expenseSchema>) => {';
const nextStr = '    return (';
const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(nextStr, startIndex);

const newLogic = `    const onSubmit = (values: z.infer<typeof expenseSchema>) => {
        addEntry({
            label: values.label,
            amount: values.amount,
            category: values.type === 'expense' ? values.category : 'other',
            frequency: values.frequency as any,
            type: values.type === 'revenue' ? 'income' : 'expense',
            date: values.date
        });

        if (values.type === 'revenue' && values.amount > 0) {
            awardXP('first_revenue');
        }

        setIsOpen(false);
        form.reset({
            label: '',
            amount: 0,
            category: 'Divers',
            type: 'expense',
            date: values.date,
            frequency: 'one-time'
        });
        toast({
            title: language === 'fr' ? 'Succès' : 'Success',
            description: language === 'fr' ? 'Opération ajoutée avec succès' : 'Entry added successfully',
        });
    };

`;

if (startIndex !== -1 && endIndex !== -1) {
    content = content.substring(0, startIndex) + newLogic + content.substring(endIndex);
    fs.writeFileSync(file, content);
    console.log('Fixed finance-entry-form.tsx');
} else {
    console.log('Indexes not found!');
}
