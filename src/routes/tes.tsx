import RegularServiceReport from '@/components/service-report/RegularServiceReport'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/tes')({
    component: RouteComponent,
})

function RouteComponent() {
    return (
        <div>
            {/* <RegularServiceReport /> */}
        </div>
    )
}
