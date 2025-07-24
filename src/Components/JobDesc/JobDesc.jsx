import React from 'react'

const JobDesc = () => {
    return (
        <div style={{ height: 132, background: 'white', boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.15)', borderBottom: '1px #B3B3B3 solid' }}>
            <div style={{ width: "85%",height: 92, flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 10, display: 'inline-flex' }}>
                <div style={{ width: "100%", justifyContent: 'space-between', alignItems: 'center', display: 'inline-flex', marginTop: "20px"}}>
                    <div style={{ height: 30, justifyContent: 'flex-start', alignItems: 'center', gap: 16, display: 'flex' }}>
                        <div style={{ color: '#63666A', fontSize: 13, fontFamily: 'Open Sans', fontWeight: '600', lineHeight: 30, letterSpacing: 0.15, wordWrap: 'break-word' }}>Job Code: 784675</div>
                    </div>
                    <div style={{ justifyContent: 'flex-end', alignItems: 'center', gap: 8, display: 'flex'}}>
                        <div style={{ paddingLeft: 8, paddingRight: 8, paddingTop: 4, paddingBottom: 4, background: '#E7F4E9', borderRadius: 16, justifyContent: 'flex-start', alignItems: 'center', gap: 4, display: 'flex'}}>
                            <div style={{ width: 8, height: 8, background: '#4FBC5F', borderRadius: 12}} />
                            <div style={{ color: 'black', fontSize: 12, fontWeight: '600', wordWrap: 'break-word' }}>Applied</div>
                        </div>
                    </div>
                </div>
                <div style={{ alignSelf: 'stretch', height: 52, flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', display: 'flex' }}>
                    <span style={{ color: '#323232', fontSize: 24, fontWeight: '600', wordWrap: 'break-word' }}>UX/UI Design Manager</span><span style={{ color: '#63666A', fontSize: 14, fontWeight: '400', wordWrap: 'break-word' }}>DCM Gurgaon, Haryana, India</span>
                </div>
            </div>
        </div>
    )
}

export default JobDesc