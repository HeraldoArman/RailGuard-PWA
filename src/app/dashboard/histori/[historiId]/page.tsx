import React, { Suspense } from 'react'
import { HistoriDetailViews } from '../../../../modules/dashboard/histori/ui/views/histori-detail-views'
import { LoaderCircle } from 'lucide-react'

const page = () => {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <LoaderCircle className="animate-spin text-primary size-8" />
        </div>
      }
    >
      <HistoriDetailViews />
    </Suspense>
  )
}

export default page