import { Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { X } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isConfirming = false,
}: ConfirmationDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      aria-labelledby="confirmation-dialog-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md p-4">
        <Card className="animate-slide-up">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle id="confirmation-dialog-title">{title}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{message}</p>
          </CardContent>
          <CardFooter className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose} disabled={isConfirming}>
              {cancelText}
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              isLoading={isConfirming}
              disabled={isConfirming}
            >
              {confirmText}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}