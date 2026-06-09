export type LoginFormValues = {
  email: string;
  password: string;
};

export type RegisterFormValues = {
  email: string;
  displayName: string;
  password: string;
  confirmPassword: string;
};

export type EmailOnlyFormValues = {
  email: string;
};

export type ResetPasswordFormValues = {
  password: string;
  confirmPassword: string;
};

export type ChangeDisplayNameFormValues = {
  displayName: string;
};

export type ChangeEmailFormValues = {
  newEmail: string;
};

export type ChangePasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

export type DeleteAccountFormValues = {
  password: string;
  confirmDeletion: boolean;
};
