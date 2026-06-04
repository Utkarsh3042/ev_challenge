import { unstable_setRequestLocale } from 'next-intl/server'
import { FormContainer } from '../../../components/form/FormContainer'
import { Suspense } from 'react'
import { LoadingSpinner } from '../../../components/common/LoadingSpinner'

export default function FormPage({ params: { lang } }: { params: { lang: string } }) {
  unstable_setRequestLocale(lang)

  return (
    <div className="flex flex-1 flex-col">
      <Suspense fallback={<div className="flex justify-center p-12"><LoadingSpinner size="lg" /></div>}>
        <FormContainer locale={lang} />
      </Suspense>
    </div>
  )
}
