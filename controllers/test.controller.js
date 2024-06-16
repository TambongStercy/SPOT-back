
const testGet = async (req, res) => {

    try {
        
        res.status(200).json({ message: 'Ok' })
    } catch (error) {
        
    }

}

const testPost = async (req, res) => {
    try {


        res.status(200).json({ message: 'OK' })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server error' })
    }
}


module.exports = { testGet, testPost }