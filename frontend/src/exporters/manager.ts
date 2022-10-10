import type CollectionExporter from "./collection/"
import { JSONExporter } from "./collection/json"

export default class ExporterManager {
    private static instance: ExporterManager
    static getInstance(): ExporterManager {
        if (!ExporterManager.instance) {
            const instance = new ExporterManager()
            instance.register(new JSONExporter())

            ExporterManager.instance = instance
        }
        return ExporterManager.instance
    }
    
    private exporters = new Map<string, CollectionExporter<any>>()
    register<T>(exporter: CollectionExporter<T>) {
        this.exporters.set(exporter.slug, exporter)
    }
    
    get<T>(slug: string): CollectionExporter<T> | undefined {
        if(!this.exporters.has(slug)) return undefined
        return this.exporters.get(slug)
    }

}