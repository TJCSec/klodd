import { useEffect, useState } from 'react'
import classnames from 'classnames'

import { ReactComponent as CopyIcon } from '../icon/copy.svg'
import { ReactComponent as CheckIcon } from '../icon/check.svg'

import './tcpserver.css'

const formatters = {
  pwn: (host, port) => `remote('${host}', ${port}, ssl=True)`,
  socat: (host, port) => `socat - openssl:${host}:${port}`,
  ncat: (host, port) => `ncat --ssl ${host} ${port}`,
  openssl: (host, port) =>
    `openssl s_client -quiet -verify_quiet -connect ${host}:${port}`,
}

const TcpServer = ({ host, port }) => {
  const [tab, setTab] = useState(() => {
    const tab = localStorage.getItem('tcpTab') ?? 'pwn'
    return formatters.hasOwnProperty(tab) ? tab : 'pwn'
  })
  const [copied, setCopied] = useState(false)

  const format = () => formatters[tab](host, port)
  const copy = async () => {
    if (copied) {
      return
    }
    await navigator.clipboard.writeText(format())
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 1000)
  }

  useEffect(() => {
    localStorage.setItem('tcpTab', tab)
  }, [tab])

  return (
    <div className="tcp">
      <div className="tcp-tabs">
        {Object.keys(formatters).map((format) => (
          <button
            key={format}
            className={classnames({ active: tab === format })}
            onClick={() => setTab(format)}
          >
            {format}
          </button>
        ))}
      </div>
      <div className="tcp-address">
        <input
          className="tcp-box"
          value={format()}
          spellCheck="false"
          readOnly
          onFocus={(e) => e.target.select()}
        />
        <button className={classnames('tcp-copy', { copied })} onClick={copy}>
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
      </div>
    </div>
  )
}

export default TcpServer
