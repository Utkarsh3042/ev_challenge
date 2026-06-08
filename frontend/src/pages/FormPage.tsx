import { FormContainer } from '@/components/form/FormContainer'
import { useTranslation } from 'react-i18next'

export function FormPage() {
  const { i18n } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <div className="flex flex-1 flex-col">
        <FormContainer locale={i18n.language} />
      </div>
    </div>
  )
}
