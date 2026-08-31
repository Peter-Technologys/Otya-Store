export class MemoryD1 {
  constructor(){ this.rows = new Map() }

  prepare(sql){ return new MemoryStatement(this, sql) }
}

class MemoryStatement {
  constructor(db, sql){
    this.db = db
    this.sql = String(sql)
    this.values = []
  }

  bind(...values){
    this.values = values
    return this
  }

  async run(){
    if (this.sql.includes('CREATE TABLE')) return { meta: { changes: 0 } }

    if (this.sql.includes('INSERT INTO owner_action_executions')) {
      const [id, actionType] = this.values
      if (this.db.rows.has(id)) return { meta: { changes: 0 } }
      this.db.rows.set(id, { id, action_type: actionType, status: 'executing' })
      return { meta: { changes: 1 } }
    }

    if (this.sql.includes("SET status = 'completed'")) {
      const [provider, providerReference, id] = this.values
      const row = this.db.rows.get(id)
      if (!row || row.status !== 'executing') return { meta: { changes: 0 } }
      this.db.rows.set(id, {
        ...row,
        status: 'completed',
        provider,
        provider_reference: providerReference,
      })
      return { meta: { changes: 1 } }
    }

    if (this.sql.includes("SET status = 'failed'")) {
      const [error, id] = this.values
      const row = this.db.rows.get(id)
      if (!row || row.status !== 'executing') return { meta: { changes: 0 } }
      this.db.rows.set(id, { ...row, status: 'failed', error })
      return { meta: { changes: 1 } }
    }

    return { meta: { changes: 0 } }
  }

  async first(){
    if (this.sql.includes('SELECT status FROM owner_action_executions')) {
      const row = this.db.rows.get(this.values[0])
      return row ? { status: row.status } : null
    }
    return null
  }
}
