import { Page, Loading } from '@wildosvpn/common/components'
import { ServicesTable } from '@wildosvpn/modules/services'
import { createLazyFileRoute, Outlet } from '@tanstack/react-router'
import { type FC, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { SudoRoute } from '@wildosvpn/libs/sudo-routes'

export const ServicesPage: FC = () => {
  const { t } = useTranslation()
  return (
    <Page title={t('services')}>
      <ServicesTable />
      <Suspense fallback={<Loading />}>
        <Outlet />
      </Suspense>
    </Page>
  )
}

export const Route = createLazyFileRoute('/_dashboard/services')({
  component: () => (
    <SudoRoute>
      {' '}
      <ServicesPage />{' '}
    </SudoRoute>
  ),
})
