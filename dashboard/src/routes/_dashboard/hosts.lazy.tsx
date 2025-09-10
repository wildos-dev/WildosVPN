import { Page, Loading } from '@wildosvpn/common/components'
import { InboundHostsTable } from '@wildosvpn/modules/hosts'
import { SudoRoute } from '@wildosvpn/libs/sudo-routes'
import { createLazyFileRoute, Outlet } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Suspense } from 'react'

export const HostsPage = () => {
  const { t } = useTranslation()
  return (
    <Page title={t('hosts')}>
      <InboundHostsTable />
      <Suspense fallback={<Loading />}>
        <Outlet />
      </Suspense>
    </Page>
  )
}

export const Route = createLazyFileRoute('/_dashboard/hosts')({
  component: () => (
    <SudoRoute>
      <HostsPage />
    </SudoRoute>
  ),
})
