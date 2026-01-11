/**
 * Server-side input validation
 * ALL validation must happen on the server
 * Never trust client-side validation
 */

/**
 * Username validation rules:
 * - 3-20 characters
 * - Allowed chars: a-z, 0-9, _, .
 * - Cannot start/end with . or _
 * - No consecutive . or _
 * - Case-insensitive uniqueness
 * - Not in reserved words list
 */
export function validateUsername(username: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Normalize
  if (!username || typeof username !== 'string') {
    return { valid: false, errors: ['Username is required'] };
  }

  const normalized = username.trim();

  // Length
  if (normalized.length < 3) {
    errors.push('Username must be at least 3 characters');
  }
  if (normalized.length > 20) {
    errors.push('Username must be at most 20 characters');
  }

  // Allowed characters (lowercase: a-z, 0-9, _, .)
  if (!/^[a-z0-9_.]+$/.test(normalized.toLowerCase())) {
    errors.push(
      'Username can only contain lowercase letters, numbers, dots, and underscores'
    );
  }

  // Cannot start/end with . or _
  if (/^[._]/.test(normalized)) {
    errors.push('Username cannot start with a dot or underscore');
  }
  if (/[._]$/.test(normalized)) {
    errors.push('Username cannot end with a dot or underscore');
  }

  // No consecutive . or _
  if (/\.\./.test(normalized)) {
    errors.push('Username cannot contain consecutive dots');
  }
  if (/__/.test(normalized)) {
    errors.push('Username cannot contain consecutive underscores');
  }

  // Reserved words
  const reserved = new Set([
    'admin',
    'support',
    'moderator',
    'founder',
    'system',
    'root',
    'test',
    'demo',
    'bot',
    'unknown',
    'anonymous',
    'null',
    'undefined',
    'api',
    'www',
  ]);

  if (reserved.has(normalized.toLowerCase())) {
    errors.push('Username is reserved and cannot be used');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Email validation
 * - Valid RFC 5322 format
 * - Case-insensitive
 * - Trim whitespace
 * - Max length: 254 characters
 * - No control characters
 */
export function validateEmail(email: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!email || typeof email !== 'string') {
    return { valid: false, errors: ['Email is required'] };
  }

  // Normalize: trim + lowercase
  const normalized = email.trim().toLowerCase();

  // Length
  if (normalized.length > 254) {
    errors.push('Email is too long (max 254 characters)');
  }
  if (normalized.length < 5) {
    errors.push('Email is too short');
  }

  // RFC 5322 simplified regex
  // Allows: localpart@domain.tld
  const emailRegex =
    /^[a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/;

  if (!emailRegex.test(normalized)) {
    errors.push('Invalid email format');
  }

  // No control characters or tabs
  if (/[\x00-\x1F\x7F]/.test(normalized)) {
    errors.push('Email contains invalid characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Display name validation
 * - 2-50 characters
 * - Allow letters, numbers, spaces, hyphens, apostrophes
 * - No control characters
 * - No excessive special characters
 */
export function validateDisplayName(displayName: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!displayName || typeof displayName !== 'string') {
    return { valid: false, errors: ['Display name is required'] };
  }

  const normalized = displayName.trim();

  // Length
  if (normalized.length < 2) {
    errors.push('Display name must be at least 2 characters');
  }
  if (normalized.length > 50) {
    errors.push('Display name must be at most 50 characters');
  }

  // Allowed characters
  if (!/^[a-zA-Z0-9\s\-']+$/.test(normalized)) {
    errors.push(
      'Display name can only contain letters, numbers, spaces, hyphens, and apostrophes'
    );
  }

  // No control characters
  if (/[\x00-\x1F\x7F]/.test(normalized)) {
    errors.push('Display name contains invalid characters');
  }

  // No excessive spaces
  if (/\s{2,}/.test(normalized)) {
    errors.push('Display name cannot contain excessive spaces');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Password validation
 * - Min 8 characters
 * - Max 128 characters
 * - Must contain at least one uppercase letter
 * - Must contain at least one lowercase letter
 * - Must contain at least one number
 * - Must contain at least one special character (!@#$%^&*)
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Password is required'] };
  }

  // Length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (password.length > 128) {
    errors.push('Password must be at most 128 characters');
  }

  // Uppercase
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Lowercase
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generic text field validation
 * Used for bio, descriptions, etc.
 */
export function validateTextField(
  value: string,
  fieldName: string,
  options: {
    minLength?: number;
    maxLength?: number;
    allowNewlines?: boolean;
    allowSpecialChars?: boolean;
  } = {}
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const {
    minLength = 0,
    maxLength = 500,
    allowNewlines = false,
    allowSpecialChars = true,
  } = options;

  if (typeof value !== 'string') {
    return { valid: false, errors: [`${fieldName} must be a string`] };
  }

  const trimmed = value.trim();

  // Length
  if (trimmed.length < minLength) {
    errors.push(
      `${fieldName} must be at least ${minLength} characters`
    );
  }
  if (trimmed.length > maxLength) {
    errors.push(
      `${fieldName} must be at most ${maxLength} characters`
    );
  }

  // Control characters (except optional newlines)
  const controlCharRegex = allowNewlines
    ? /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/
    : /[\x00-\x1F\x7F]/;

  if (controlCharRegex.test(trimmed)) {
    errors.push(`${fieldName} contains invalid characters`);
  }

  // Excessive invisible Unicode (zero-width chars, etc.)
  const invisibleCount = (trimmed.match(/[\u200B-\u200D\uFEFF]/g) || [])
    .length;
  if (invisibleCount > 5) {
    errors.push(`${fieldName} contains too many invisible characters`);
  }

  // Excessive newlines
  if (allowNewlines) {
    const newlineCount = (trimmed.match(/\n/g) || []).length;
    if (newlineCount > 10) {
      errors.push(`${fieldName} contains too many newlines`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Asset name/title validation
 */
export function validateAssetName(name: string): {
  valid: boolean;
  errors: string[];
} {
  return validateTextField(name, 'Asset name', {
    minLength: 3,
    maxLength: 100,
    allowNewlines: false,
  });
}

/**
 * Asset description validation
 */
export function validateAssetDescription(description: string): {
  valid: boolean;
  errors: string[];
} {
  return validateTextField(description, 'Description', {
    minLength: 0,
    maxLength: 2000,
    allowNewlines: true,
  });
}

/**
 * Tags validation (comma-separated)
 */
export function validateTags(tagsString: string): {
  valid: boolean;
  tags: string[];
  errors: string[];
} {
  const errors: string[] = [];
  const tags: string[] = [];

  if (!tagsString || typeof tagsString !== 'string') {
    return { valid: true, tags: [], errors: [] };
  }

  const tagArray = tagsString
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  // Max 10 tags
  if (tagArray.length > 10) {
    errors.push('Maximum 10 tags allowed');
  }

  // Each tag validation
  for (const tag of tagArray) {
    if (tag.length < 2) {
      errors.push(`Tag "${tag}" is too short (min 2 characters)`);
      continue;
    }
    if (tag.length > 20) {
      errors.push(`Tag "${tag}" is too long (max 20 characters)`);
      continue;
    }
    if (!/^[a-z0-9\-]+$/.test(tag.toLowerCase())) {
      errors.push(
        `Tag "${tag}" contains invalid characters (only letters, numbers, hyphens)`
      );
      continue;
    }
    tags.push(tag.toLowerCase());
  }

  return {
    valid: errors.length === 0,
    tags,
    errors,
  };
}

/**
 * Price validation
 */
export function validatePrice(price: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const numPrice = Number(price);

  if (isNaN(numPrice)) {
    return { valid: false, errors: ['Price must be a number'] };
  }

  if (numPrice < 0) {
    errors.push('Price cannot be negative');
  }

  if (numPrice > 99999) {
    errors.push('Price cannot exceed $99,999');
  }

  // Only 2 decimal places
  if (numPrice !== Math.round(numPrice * 100) / 100) {
    errors.push('Price can only have up to 2 decimal places');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Category validation
 */
export function validateCategory(category: string): {
  valid: boolean;
  errors: string[];
} {
  const validCategories = [
    '3D Models',
    'UI Design',
    'Scripts',
    'Animations',
    'Plugins',
    'Sounds',
    'Images',
    'Other',
  ];

  if (!validCategories.includes(category)) {
    return {
      valid: false,
      errors: [
        `Invalid category. Allowed: ${validCategories.join(', ')}`,
      ],
    };
  }

  return { valid: true, errors: [] };
}

/**
 * File upload validation
 */
export function validateFileUpload(file: {
  name: string;
  size: number;
  type: string;
}): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB for asset files
  const ALLOWED_TYPES = [
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/zip',
    'application/x-zip-compressed',
  ];

  // Filename validation
  if (!file.name || file.name.length === 0) {
    errors.push('Filename is required');
  }
  if (file.name.length > 255) {
    errors.push('Filename is too long');
  }
  if (/[\x00-\x1F]/.test(file.name)) {
    errors.push('Filename contains invalid characters');
  }

  // Size validation
  if (file.size === 0) {
    errors.push('File is empty');
  }
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File must be smaller than 100MB`);
  }

  // Type validation
  if (!ALLOWED_TYPES.includes(file.type)) {
    errors.push(
      `File type not allowed. Allowed: PNG, JPEG, WebP, ZIP`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Image file validation
 */
export function validateImageFile(file: {
  name: string;
  size: number;
  type: string;
}): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

  // Size
  if (file.size > MAX_SIZE) {
    errors.push('Image must be smaller than 5MB');
  }

  // Type
  if (!ALLOWED_TYPES.includes(file.type)) {
    errors.push('Only PNG, JPEG, and WebP images are allowed');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
