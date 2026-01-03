import React from "react"

import DepartureSection from "./DepartureSection"

function Home() {

    return (
        <>
            <DepartureSection />

            {/* 大きなボタン */ }
            <div className="big-buttons">
                <a href="#" className="btn btn-subway">地下鉄に乗る</a>
                <a href="#" className="btn btn-bus">バスに乗る</a>
            </div>
        </>
    )
}

export default Home