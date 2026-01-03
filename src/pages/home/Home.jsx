import { Button } from "@mui/material"

import DepartureSection from "./DepartureSection"

function Home() {

    return (
        <>
            <DepartureSection />

            {/* 大きなボタン */ }
            <div className="big-buttons"><Button
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                sx={{ py: 3, fontSize: 22 }}
                >
                地下鉄に乗る
            </Button>

            <Button
                variant="contained"
                color="secondary"
                size="large"
                fullWidth
                sx={{ py: 3, fontSize: 22 }}
                >
                バスに乗る
            </Button>
            </div>
        </>
    )
}

export default Home