import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CHANGE_PASSWORD_MUTATION, CHANGE_EMAIL_MUTATION, DELETE_ACCOUNT_MUTATION } from '../lib/queries';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import toast from 'react-hot-toast';

interface PasswordForm {
  newPassword: string;
}

interface EmailForm {
  newEmail: string;
}

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const passwordForm = useForm<PasswordForm>();
  const emailForm = useForm<EmailForm>();

  const [changePassword, { loading: passwordLoading }] = useMutation(CHANGE_PASSWORD_MUTATION, {
    onCompleted: (data) => {
      if (data.changePassword.success) {
        toast.success(data.changePassword.message);
        passwordForm.reset();
      } else {
        toast.error(data.changePassword.message);
      }
    },
    onError: (error) => {
      toast.error('Network error: ' + error.message);
    },
  });

  const [changeEmail, { loading: emailLoading }] = useMutation(CHANGE_EMAIL_MUTATION, {
    onCompleted: (data) => {
      if (data.changeEmail.success) {
        toast.success(data.changeEmail.message);
        emailForm.reset();
      } else {
        toast.error(data.changeEmail.message);
      }
    },
    onError: (error) => {
      toast.error('Network error: ' + error.message);
    },
  });

  const [deleteAccount, { loading: deleteLoading }] = useMutation(DELETE_ACCOUNT_MUTATION, {
    onCompleted: (data) => {
      if (data.deleteAccount.success) {
        toast.success(data.deleteAccount.message);
        logout();
        navigate('/dashboard');
      } else {
        toast.error(data.deleteAccount.message);
      }
    },
    onError: (error) => {
      toast.error('Network error: ' + error.message);
    },
  });

  const handlePasswordSubmit = (data: PasswordForm) => {
    changePassword({
      variables: {
        input: {
          userId: user?.id,
          newPassword: data.newPassword,
        },
      },
    });
  };

  const handleEmailSubmit = (data: EmailForm) => {
    changeEmail({
      variables: {
        input: {
          userId: user?.id,
          newEmail: data.newEmail,
        },
      },
    });
  };

  const handleDeleteAccount = () => {
    deleteAccount({
      variables: { input: { userId: user?.id } },
    });
    setShowDeleteDialog(false);
  };

  if (!user) {
    return <div>Please log in to access settings.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your account preferences and security settings
          </p>
        </div>

        {/* Change Password Section */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  {...passwordForm.register('newPassword', { required: true })}
                  className="mt-1"
                />
              </div>
              <Button type="submit" disabled={passwordLoading}>
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Email Section */}
        <Card>
          <CardHeader>
            <CardTitle>Change Email</CardTitle>
            <CardDescription>Current email: {user.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="newEmail">New Email</Label>
                <Input
                  id="newEmail"
                  type="email"
                  {...emailForm.register('newEmail', { required: true })}
                  className="mt-1"
                />
              </div>
              <Button type="submit" disabled={emailLoading}>
                {emailLoading ? 'Updating...' : 'Update Email'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Delete Account Section */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>Permanently delete your account and all associated data</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive">Delete Account</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you absolutely sure?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteLoading}>
                    {deleteLoading ? 'Deleting...' : 'Delete Account'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;