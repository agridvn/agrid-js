import { useAgrid } from 'agrid-js/react'
import { useEffect, useState } from 'react'

export default function Home() {
    const agrid = useAgrid()

    const [otherHost, setOtherHost] = useState('')

    useEffect(() => {
        setOtherHost(window.location.origin.includes('other-localhost') ? 'localhost' : 'other-localhost')
    })

    return (
        <>
            <h1>Iframes</h1>

            <h2>Cross origin iframe</h2>
            <p>
                This loads the same page but from <b>other-localhost</b> which you need to add to your hosts file.
            </p>

            {otherHost && (
                <iframe
                    className="border rounded"
                    src={`http://${otherHost}:3000/`}
                    style={{ width: '100%', height: '500px' }}
                    onLoad={() => {
                        agrid.capture('iframe loaded')
                    }}
                />
            )}
        </>
    )
}
