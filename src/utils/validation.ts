export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): string[] => {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  return errors;
};

export const validateRequired = (value: string, fieldName: string): string | null => {
  if (!value.trim()) {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateInvoiceItem = (item: { description: string; quantity: number; rate: number }): string[] => {
  const errors: string[] = [];
  
  if (!item.description.trim()) {
    errors.push('Description is required');
  }
  
  if (item.quantity <= 0) {
    errors.push('Quantity must be greater than 0');
  }
  
  if (item.rate < 0) {
    errors.push('Rate cannot be negative');
  }
  
  return errors;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};