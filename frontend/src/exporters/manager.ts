import type { Exporter } from "."
import { JSONExporter } from "./json"
import { SageCVTExporter } from "./sage-cvt"

export default class ExporterManager {
    private static instance: ExporterManager
    static getInstance(): ExporterManager {
        if (!ExporterManager.instance) {
            const instance = new ExporterManager()
            instance.register(new JSONExporter())
            instance.register(new SageCVTExporter())

            ExporterManager.instance = instance
        }
        return ExporterManager.instance
    }
    
    private exporters = new Map<string, Exporter<any>>()
    register<T>(exporter: Exporter<T>) {
        this.exporters.set(exporter.slug, exporter)
    }
    
    get<T>(slug: string): Exporter<T> | undefined {
        if(!this.exporters.has(slug)) return undefined
        return this.exporters.get(slug)
    }

}