import React, {Component} from 'react'
import {connect} from 'react-redux'
import Selectors from "../../redux/selectors"

class FormatOrderContractTypePage extends Component {
  constructor() {
    super()
  }
  render() {
    let {value, item} = this.props, option = item.filter(r=>r.value === String(value))[0]
    return (<span>{option && option.label || "未知"}</span>)
  }
}

const mapStateToProps = (state, ownProps) => ({
  item: Selectors.getOrderContractType(state),
})

export default connect(mapStateToProps)(FormatOrderContractTypePage)
