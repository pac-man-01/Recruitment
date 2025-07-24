import React from 'react'

const SideMenu = () => {
    return (
        <div style={{ width: 56, height: 700, background: 'white', boxShadow: '-1px 0px 0px rgba(0, 0, 0, 0.12) inset', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', display: 'inline-flex', float: 'inline-start' }}>
            <div style={{ alignSelf: 'stretch', flex: '1 1 0', paddingTop: 24, flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', display: 'flex' }}>
                <div style={{ alignSelf: 'stretch', height: 48, paddingLeft: 16, paddingRight: 16, paddingTop: 8, paddingBottom: 8, justifyContent: 'flex-start', alignItems: 'center', display: 'inline-flex' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#8b9097" d="M464 128H272l-64-64H48C21.5 64 0 85.5 0 112v288c0 26.5 21.5 48 48 48h416c26.5 0 48-21.5 48-48V176c0-26.5-21.5-48-48-48z" /></svg>
                </div>
                <div style={{ width: 75, height: 48, paddingRight: 16, borderTopLeftRadius: 40, borderTopRightRadius: 40, justifyContent: 'flex-start', alignItems: 'center', display: 'inline-flex' }}>
                    <svg width="53" height="48" viewBox="0 0 53 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 0H28C41.2548 0 52 10.7452 52 24C52 37.2548 41.2548 48 28 48H0V0Z" fill="black" fill-opacity="0.04" />
                        <path d="M0 0H1C2.10457 0 3 0.895431 3 2V46C3 47.1046 2.10457 48 1 48H0V0Z" fill="#26890D" />
                        <path d="M29 29H21C20.45 29 20 29.45 20 30C20 30.55 20.45 31 21 31H29C29.55 31 30 30.55 30 30C30 29.45 29.55 29 29 29ZM35 21H21C20.45 21 20 21.45 20 22C20 22.55 20.45 23 21 23H35C35.55 23 36 22.55 36 22C36 21.45 35.55 21 35 21ZM21 27H35C35.55 27 36 26.55 36 26C36 25.45 35.55 25 35 25H21C20.45 25 20 25.45 20 26C20 26.55 20.45 27 21 27ZM20 18C20 18.55 20.45 19 21 19H35C35.55 19 36 18.55 36 18C36 17.45 35.55 17 35 17H21C20.45 17 20 17.45 20 18Z" fill="#26890D" />
                    </svg>
                </div>
            </div>
        </div>
    )
}

export default SideMenu