import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './messages/en.json'
import hi from './messages/hi.json'
import kn from './messages/kn.json'

const resources = {
  en,
  hi,
  kn,
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
      prefix: '{',
      suffix: '}'
    },
  })

export default i18n
