import { Suspense } from 'react';
import EditPolicyForm from './EditPolicyForm';
import { Loader2 } from 'lucide-react';

interface EditPolicyPageProps {
  params: {
    id: string;
  };
}

export default function EditPolicyPage({ params }: EditPolicyPageProps) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    }>
      <EditPolicyForm policyId={params.id} />
    </Suspense>
  );
} 