import React, {Component} from 'react'
import {connect} from 'react-redux'
import Selectors from "../../redux/selectors"

class FormatFinanceServiceSettlementStatusPage extends Component {
  render() {
    let {value, item} = this.props, option = item.filter(r=>r.value === String(value))[0]
    return (<span>{option && option.label || "未知"}</span>)
  }
}

const mapStateToProps = (state, ownProps) => ({
  item: Selectors.getFinanceServiceSettlementStatus(state),
})

export default connect(mapStateToProps)(FormatFinanceServiceSettlementStatusPage)
