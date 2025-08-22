'use client'
import { Suspense, lazy } from 'react'
import { Activity, Globe, MessageCircle } from 'lucide-react'
const MapWorld = lazy(() => import('@/components/ui/MapWorld'))
const MonitoringChart = lazy(() => import('@/components/ui/MonitoringChart'))

export function Features() {
    return (
        <section className="px-4 py-16 md:py-32">
            <div className="mx-auto grid max-w-5xl border md:grid-cols-2">
                <div>
                    <div className="p-6 sm:p-12">
                        <span className="text-muted-foreground flex items-center gap-2">
                            <Globe className="size-4" />
                            Global invoicing and payments
                        </span>

                        <p className="mt-8 text-2xl font-semibold">Send invoices and accept payments worldwide. Track performance at a glance.</p>
                    </div>

                    <div aria-hidden className="relative">
                        <div className="absolute inset-0 z-10 m-auto size-fit">
                            <div className="rounded-[--radius] bg-background z-[1] dark:bg-muted relative flex size-fit w-fit items-center gap-2 border px-3 py-1 text-xs font-medium shadow-md shadow-black/5">
                                <span className="text-lg">🇳🇬</span> Last payment received from Nigeria
                            </div>
                            <div className="rounded-[--radius] bg-background absolute inset-2 -bottom-2 mx-auto border px-3 py-4 text-xs font-medium shadow-md shadow-black/5 dark:bg-zinc-900"></div>
                        </div>

                        <div className="relative overflow-hidden">
                            <div className="[background-image:radial-gradient(var(--tw-gradient-stops))] z-1 to-background absolute inset-0 from-transparent to-75%"></div>
                            <Suspense fallback={<div className="h-[220px]" />}>
                                <MapWorld />
                            </Suspense>
                        </div>
                    </div>
                </div>
                <div className="overflow-hidden border-t bg-zinc-50 p-6 sm:p-12 md:border-0 md:border-l dark:bg-transparent">
                    <div className="relative z-10">
                        <span className="text-muted-foreground flex items-center gap-2">
                            <MessageCircle className="size-4" />
                            Email and in-app support
                        </span>

                        <p className="my-8 text-2xl font-semibold">Get help fast—right inside Ledgr or via email whenever you need it.</p>
                    </div>
                    <div aria-hidden className="flex flex-col gap-8">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="flex justify-center items-center size-5 rounded-full border">
                                    <span className="size-3 rounded-full bg-primary"/>
                                </span>
                                <span className="text-muted-foreground text-xs">Sat 22 Feb</span>
                            </div>
                            <div className="rounded-[--radius] bg-background mt-1.5 w-3/5 border p-3 text-xs">Hey, can I customize my invoice template?</div>
                        </div>

                        <div>
                            <div className="rounded-[--radius] mb-1 ml-auto w-3/5 bg-blue-600 p-3 text-xs text-white">Absolutely! Go to Settings → Branding to upload your logo and colors.</div>
                            <span className="text-muted-foreground block text-right text-xs">Now</span>
                        </div>
                    </div>
                </div>
                <div className="col-span-full border-y p-12">
                    <p className="text-center text-4xl font-semibold lg:text-7xl">99.99% Uptime</p>
                </div>
                <div className="relative col-span-full">
                    <div className="absolute z-10 max-w-lg px-6 pr-12 pt-6 md:px-12 md:pt-12">
                        <span className="text-muted-foreground flex items-center gap-2">
                            <Activity className="size-4" />
                            Billing activity
                        </span>

                        <p className="my-8 text-2xl font-semibold">
                            Track invoices and payments in real-time. <span className="text-muted-foreground"> See what’s due, paid, and trending.</span>
                        </p>
                    </div>
                    <Suspense fallback={<div className="h-96" />}>
                        <MonitoringChart />
                    </Suspense>
                </div>
            </div>
        </section>
    )
}
