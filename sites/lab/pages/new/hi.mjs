/*
 * This page is auto-generated. Do not edit it by hand.
 */
import { Hi } from 'designs/hi/src/index.mjs'
// Dependencies
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { nsMerge } from 'shared/utils.mjs'
import { workbenchInlineDocs } from 'shared/mdx/docs.mjs'
// Components
import { PageWrapper, ns as pageNs } from 'shared/components/wrappers/page.mjs'
import { Workbench, ns as wbNs } from 'shared/components/workbench/new.mjs'
import { WorkbenchLayout } from 'site/components/layouts/workbench.mjs'

// Translation namespaces used on this page
const ns = nsMerge('hi', wbNs, pageNs)

const NewHiPage = ({ page, docs }) => (
  <PageWrapper {...page} title="Hi" layout={WorkbenchLayout} header={null}>
    <Workbench
      {...{
        design: 'hi',
        Design: Hi,
        docs,
      }}
    />
  </PageWrapper>
)

export default NewHiPage

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ns)),
      docs: await workbenchInlineDocs({
        Design: Hi,
        design: 'hi',
        locale,
      }),
      page: {
        locale,
        path: ['new', 'hi'],
        title: 'Hi',
      },
    },
  }
}
