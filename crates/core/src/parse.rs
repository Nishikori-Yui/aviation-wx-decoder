use nom::branch::alt;
use nom::bytes::complete::{tag, take_while_m_n};
use nom::character::complete::char;
use nom::combinator::{map, opt, recognize};
use nom::sequence::{pair, preceded};
use nom::IResult;

use crate::{UtcTime, ValidityPeriod, Visibility, Wind};

fn parse_u8(input: &str, len: usize) -> IResult<&str, u8> {
    map(take_while_m_n(len, len, |c: char| c.is_ascii_digit()), |s: &str| {
        s.parse::<u8>().unwrap_or(0)
    })(input)
}

fn parse_u16(input: &str, len: usize) -> IResult<&str, u16> {
    map(take_while_m_n(len, len, |c: char| c.is_ascii_digit()), |s: &str| {
        s.parse::<u16>().unwrap_or(0)
    })(input)
}

pub fn parse_time_group(input: &str) -> IResult<&str, UtcTime> {
    let (input, day) = parse_u8(input, 2)?;
    let (input, hour) = parse_u8(input, 2)?;
    let (input, minute) = parse_u8(input, 2)?;
    let (input, _) = opt(char('Z'))(input)?;
    Ok((input, UtcTime { day, hour, minute }))
}

pub fn parse_validity(input: &str) -> IResult<&str, ValidityPeriod> {
    let (input, from_day) = parse_u8(input, 2)?;
    let (input, from_hour) = parse_u8(input, 2)?;
    let (input, _) = char('/')(input)?;
    let (input, to_day) = parse_u8(input, 2)?;
    let (input, to_hour) = parse_u8(input, 2)?;
    Ok((
        input,
        ValidityPeriod {
            from: UtcTime {
                day: from_day,
                hour: from_hour,
                minute: 0,
            },
            to: UtcTime {
                day: to_day,
                hour: to_hour,
                minute: 0,
            },
        },
    ))
}

pub fn parse_wind(input: &str) -> IResult<&str, Wind> {
    let (input, dir) = alt((
        map(tag("VRB"), |_| None),
        map(|i| parse_u16(i, 3), Some),
    ))(input)?;
    let (input, speed) = alt((|i| parse_u16(i, 2), |i| parse_u16(i, 3)))(input)?;
    let (input, gust) = opt(preceded(char('G'), alt((|i| parse_u16(i, 2), |i| parse_u16(i, 3)))))(input)?;
    let (input, unit) = alt((tag("KT"), tag("MPS")))(input)?;

    Ok((
        input,
        Wind {
            direction_deg: dir,
            variable: dir.is_none(),
            speed,
            gust,
            unit: unit.to_string(),
        },
    ))
}

pub fn parse_wind_variation(input: &str) -> IResult<&str, (u16, u16)> {
    let (input, from) = parse_u16(input, 3)?;
    let (input, _) = char('V')(input)?;
    let (input, to) = parse_u16(input, 3)?;
    Ok((input, (from, to)))
}

pub fn parse_visibility_meters(input: &str) -> IResult<&str, Visibility> {
    map(take_while_m_n(4, 4, |c: char| c.is_ascii_digit()), |s: &str| {
        Visibility {
            distance: s.parse::<u32>().unwrap_or(0),
            unit: "M".to_string(),
            raw: s.to_string(),
        }
    })(input)
}

pub fn parse_visibility_sm(input: &str) -> IResult<&str, Visibility> {
    let (input, value) = recognize(pair(
        take_while_m_n(1, 2, |c: char| c.is_ascii_digit()),
        opt(pair(char('/'), take_while_m_n(1, 2, |c: char| c.is_ascii_digit()))),
    ))(input)?;
    let (input, _) = tag("SM")(input)?;
    let distance = if value.contains('/') {
        let parts: Vec<&str> = value.split('/').collect();
        if parts.len() == 2 {
            let num = parts[0].parse::<f32>().unwrap_or(0.0);
            let den = parts[1].parse::<f32>().unwrap_or(1.0);
            (num / den).round() as u32
        } else {
            0
        }
    } else {
        value.parse::<u32>().unwrap_or(0)
    };

    Ok((
        input,
        Visibility {
            distance,
            unit: "SM".to_string(),
            raw: format!("{}SM", value),
        },
    ))
}

pub fn parse_temperature_pair(input: &str) -> IResult<&str, (i16, i16)> {
    let (input, temp) = parse_signed_temp(input)?;
    let (input, _) = char('/')(input)?;
    let (input, dew) = parse_signed_temp(input)?;
    Ok((input, (temp, dew)))
}

fn parse_signed_temp(input: &str) -> IResult<&str, i16> {
    let (input, sign) = opt(char('M'))(input)?;
    let (input, value) = map(take_while_m_n(2, 2, |c: char| c.is_ascii_digit()), |s: &str| {
        s.parse::<i16>().unwrap_or(0)
    })(input)?;
    let result = if sign.is_some() { -value } else { value };
    Ok((input, result))
}

pub fn parse_pressure_qnh(input: &str) -> IResult<&str, u16> {
    let (input, _) = char('Q')(input)?;
    let (input, value) = map(take_while_m_n(4, 4, |c: char| c.is_ascii_digit()), |s: &str| {
        s.parse::<u16>().unwrap_or(0)
    })(input)?;
    Ok((input, value))
}

pub fn parse_pressure_altimeter(input: &str) -> IResult<&str, u16> {
    let (input, _) = char('A')(input)?;
    let (input, value) = map(take_while_m_n(4, 4, |c: char| c.is_ascii_digit()), |s: &str| {
        s.parse::<u16>().unwrap_or(0)
    })(input)?;
    Ok((input, value))
}

pub fn parse_cloud_layer(input: &str) -> IResult<&str, (String, Option<u16>, Option<String>)> {
    let (input, amount) = alt((tag("FEW"), tag("SCT"), tag("BKN"), tag("OVC"), tag("NSC"), tag("SKC")))(input)?;
    let (input, height) = opt(map(take_while_m_n(3, 3, |c: char| c.is_ascii_digit()), |s: &str| {
        s.parse::<u16>().unwrap_or(0) * 100
    }))(input)?;
    let (input, cloud_type) = opt(alt((tag("CB"), tag("TCU"))))(input)?;
    Ok((input, (amount.to_string(), height, cloud_type.map(|s| s.to_string()))))
}

