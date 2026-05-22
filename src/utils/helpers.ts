// Date formatting utilities
export const formatDate = (date: string | Date) => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatDateTime = (date: string | Date) => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatTime = (time: string | null) => {
  if (!time) return '--';
  const [hour, minute] = time.split(':');
  return `${hour}:${minute}`;
};

// Get status color for badges
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    INACTIVE: 'bg-red-100 text-red-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    PRESENT: 'bg-green-100 text-green-800',
    ABSENT: 'bg-red-100 text-red-800',
    LATE: 'bg-orange-100 text-orange-800',
    LEAVE: 'bg-blue-100 text-blue-800',
    PAID: 'bg-green-100 text-green-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

// Get badge icon
export const getStatusIcon = (status: string): string => {
  const icons: Record<string, string> = {
    ACTIVE: '✓',
    INACTIVE: '✕',
    PENDING: '⏳',
    APPROVED: '✓',
    REJECTED: '✕',
    PRESENT: '✓',
    ABSENT: '✕',
    LATE: '⏱',
    LEAVE: '📅',
    PAID: '✓',
    PROCESSING: '⏳',
  };
  return icons[status] || '';
};

// Calculate age from date of birth
export const calculateAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// Calculate days difference
export const daysDifference = (date1: string, date2: string): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const difference = d2.getTime() - d1.getTime();
  return Math.ceil(difference / (1000 * 3600 * 24));
};

// Calculate tenure
export const calculateTenure = (joiningDate: string): string => {
  const joining = new Date(joiningDate);
  const today = new Date();
  const years = today.getFullYear() - joining.getFullYear();
  const months = today.getMonth() - joining.getMonth();

  if (years > 0) {
    return `${years} year${years > 1 ? 's' : ''} ${months > 0 ? `${months} month${months > 1 ? 's' : ''}` : ''}`.trim();
  }
  return `${months} month${months > 1 ? 's' : ''}`;
};

// Validate email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

// Format phone number
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length !== 10) return phone;
  return `+91-${cleaned.substring(0, 5)}-${cleaned.substring(5)}`;
};

// Truncate string
export const truncateString = (str: string, length: number = 50): string => {
  return str.length > length ? `${str.substring(0, length)}...` : str;
};

// Get initials from name
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Parse error message
export const parseErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.data?.error) return error.response.data.error;
  return 'An unexpected error occurred';
};

// Generate random hex color
export const getRandomColor = (): string => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Get role display name
export const getRoleDisplayName = (role: string): string => {
  const roleMap: Record<string, string> = {
    ADMIN: 'Administrator',
    HR_MANAGER: 'HR Manager',
    TEAM_LEAD: 'Team Lead',
    EMPLOYEE: 'Employee',
  };
  return roleMap[role] || role;
};

// Calculate percentage
export const calculatePercentage = (part: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
};
