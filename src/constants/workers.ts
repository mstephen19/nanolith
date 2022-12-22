/**
 * The types of workers supported by the library.
 */
export const enum WorkerType {
    /**
     * A short-term one-time worker that is spawned, runs a task,
     * then automatically shuts down.
     */
    Task,
    /**
     * A long-running worker that has access to all the tasks on the
     * set of definitions it was launched from.
     */
    Service,
}
