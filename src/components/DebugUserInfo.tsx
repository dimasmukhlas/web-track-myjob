import { useAuth } from '@/hooks/useFirebaseAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

export function DebugUserInfo() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  if (!user) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Debug: User Info</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No user logged in</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Debug: User Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Email:</label>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        
        <div>
          <label className="text-sm font-medium">Firebase UID:</label>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground font-mono break-all">{user.uid}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(user.uid)}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Display Name:</label>
          <p className="text-sm text-muted-foreground">{user.displayName || 'Not set'}</p>
        </div>

        <div>
          <label className="text-sm font-medium">Provider:</label>
          <p className="text-sm text-muted-foreground">
            {user.providerData.map(provider => provider.providerId).join(', ')}
          </p>
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Copy the Firebase UID above and use it in the SQL migration script.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}


