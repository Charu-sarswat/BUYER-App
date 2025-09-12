import { BuyerDetail } from '@/components/buyer-detail'

export default function BuyerDetailPage({
  params,
}: {
  params: { id: string }
}) {
  return <BuyerDetail buyerId={params.id} />
}
