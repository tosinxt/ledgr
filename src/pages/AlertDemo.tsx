import { Alert, AlertIcon, AlertTitle, AlertToolbar } from '@/components/ui/alert-1';
import { Button } from '@/components/ui/button-1';
import { Bell, CheckCircle2, OctagonAlert, Info, AlertTriangle } from 'lucide-react';

export default function AlertDemo() {
  return (
    <div className="flex flex-col gap-5 p-10 w-full mx-auto max-w-[600px] min-h-screen justify-center items-center">
      <Alert variant="primary" close={true}>
        <AlertIcon>
          <Bell />
        </AlertIcon>
        <AlertTitle>This is a primary alert</AlertTitle>
        <AlertToolbar>
          <Button variant="inverse" mode="link" underlined="solid" size="sm" className="flex mt-0.5">
            Upgrade
          </Button>
        </AlertToolbar>
      </Alert>

      <Alert variant="success" close={true}>
        <AlertIcon>
          <CheckCircle2 />
        </AlertIcon>
        <AlertTitle>This is a success alert</AlertTitle>
        <AlertToolbar>
          <Button variant="inverse" mode="link" underlined="solid" size="sm" className="flex mt-0.5">
            Continue
          </Button>
        </AlertToolbar>
      </Alert>

      <Alert variant="destructive" close={true}>
        <AlertIcon>
          <OctagonAlert />
        </AlertIcon>
        <AlertTitle>This is a destructive alert</AlertTitle>
        <AlertToolbar>
          <Button variant="inverse" mode="link" underlined="solid" size="sm" className="flex mt-0.5">
            Resolve
          </Button>
        </AlertToolbar>
      </Alert>

      <Alert variant="info" close={true}>
        <AlertIcon>
          <Info />
        </AlertIcon>
        <AlertTitle>This is an info alert</AlertTitle>
        <AlertToolbar>
          <Button variant="inverse" mode="link" underlined="solid" size="sm" className="flex mt-0.5">
            Learn more
          </Button>
        </AlertToolbar>
      </Alert>

      <Alert variant="warning" close={true}>
        <AlertIcon>
          <AlertTriangle />
        </AlertIcon>
        <AlertTitle>This is a warning alert</AlertTitle>
        <AlertToolbar>
          <Button variant="inverse" mode="link" underlined="solid" size="sm" className="flex mt-0.5">
            Review
          </Button>
        </AlertToolbar>
      </Alert>
    </div>
  );
}
